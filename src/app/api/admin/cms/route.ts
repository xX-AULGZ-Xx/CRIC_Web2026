import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getSession, logAudit } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { repairDatabaseIntegrity } from '@/lib/migration'
import bcrypt from 'bcryptjs'
import AdmZip from 'adm-zip'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleName = searchParams.get('module')
    const action = searchParams.get('action')

    if (moduleName === 'galleries' && action === 'immich_albums') {
      const settings = await getSettings()
      const serverUrl = (settings.immich_server_url || '').replace(/\/+$/, '')
      const apiKey = settings.immich_api_key || ''
      if (!serverUrl || !apiKey) {
        return NextResponse.json(
          { error: 'กรุณาตั้งค่า Immich Server URL และ API Key ในหน้าตั้งค่าเว็บไซต์ก่อน' },
          { status: 400 }
        )
      }
      try {
        const res = await fetch(`${serverUrl}/api/albums`, {
          headers: { 'x-api-key': apiKey, Accept: 'application/json' },
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error(`Immich API responded with status ${res.status}`)
        }
        const albums = await res.json()
        return NextResponse.json({ success: true, albums })
      } catch (err: any) {
        return NextResponse.json(
          { error: `ไม่สามารถเชื่อมต่อ Immich Server: ${err?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    if (moduleName === 'backups' && action === 'list') {
      const backupDir = path.join(process.cwd(), 'public', 'backups')
      await fs.mkdir(backupDir, { recursive: true })
      const entries = await fs.readdir(backupDir, { withFileTypes: true })
      const files = []
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.zip')) {
          const stat = await fs.stat(path.join(backupDir, entry.name))
          files.push({
            name: entry.name,
            size: stat.size,
            created_at: stat.mtime.toISOString(),
            url: `/backups/${entry.name}`,
          })
        }
      }
      files.sort((a, b) => b.created_at.localeCompare(a.created_at))
      return NextResponse.json({ success: true, backups: files })
    }

    return NextResponse.json({ error: 'Invalid GET query' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { module: moduleName, action, data = {} } = body

    // =========================================================================
    // 1. SLIDERS
    // =========================================================================
    if (moduleName === 'sliders') {
      if (action === 'save') {
        const payload = {
          title: data.title || null,
          subtitle: data.subtitle || null,
          link: data.link || null,
          image_path: data.image_path || '',
          order_num: Number(data.order_num ?? 0),
          is_active: Boolean(data.is_active ?? true),
          fit_width: Boolean(data.fit_width ?? false),
        }
        if (data.id) {
          const item = await prisma.sliders.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'sliders', item.id, `Updated slider: ${item.title || item.id}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.sliders.create({ data: payload })
          await logAudit('CREATE', 'sliders', item.id, `Created slider: ${item.title || item.id}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.sliders.delete({ where: { id } })
        await logAudit('DELETE', 'sliders', id, `Deleted slider #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 2. NEWS & NEWS CATEGORIES
    // =========================================================================
    if (moduleName === 'news') {
      if (action === 'save') {
        const rawSlug =
          (data.slug || data.title || '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\wก-๙-]/g, '')
            .slice(0, 200) || `news-${Date.now()}`

        let slug = rawSlug
        const existingSlug = await prisma.news.findFirst({
          where: {
            slug,
            ...(data.id ? { NOT: { id: Number(data.id) } } : {}),
          },
        })
        if (existingSlug) {
          slug = `${rawSlug}-${Date.now().toString().slice(-4)}`
        }

        let defaultCatId = data.category_id ? Number(data.category_id) : 0
        if (!defaultCatId) {
          const firstCat = await prisma.news_categories.findFirst({ orderBy: { id: 'asc' } })
          if (firstCat) {
            defaultCatId = firstCat.id
          } else {
            const createdCat = await prisma.news_categories.create({
              data: { name: 'ข่าวประชาสัมพันธ์', slug: 'general' },
            })
            defaultCatId = createdCat.id
          }
        }

        const payload: any = {
          title: String(data.title || '').trim(),
          slug,
          content: String(data.content || ''),
          cover_image: data.cover_image || null,
          cover_position: data.cover_position || '50%',
          category_id: defaultCatId,
          status: (data.status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
          gallery_id: data.gallery_id ? Number(data.gallery_id) : null,
          additional_images: data.additional_images
            ? typeof data.additional_images === 'string'
              ? data.additional_images
              : JSON.stringify(data.additional_images)
            : null,
          pdf_path: data.pdf_path || null,
          meta_title: data.meta_title || null,
          meta_description: data.meta_description || null,
          ...(data.created_at ? { created_at: new Date(data.created_at) } : {}),
        }

        const tagsList: string[] = Array.isArray(data.tags)
          ? data.tags
          : String(data.tags || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)

        let item: any
        if (data.id) {
          const newsId = Number(data.id)
          item = await prisma.news.update({
            where: { id: newsId },
            data: payload,
          })
          await prisma.news_tags.deleteMany({ where: { news_id: newsId } })
          if (tagsList.length > 0) {
            await prisma.news_tags.createMany({
              data: tagsList.map((tag_name) => ({ news_id: newsId, tag_name: tag_name.slice(0, 50) })),
              skipDuplicates: true,
            })
          }
          await logAudit('UPDATE', 'news', item.id, `Updated news: ${item.title}`)
        } else {
          item = await prisma.news.create({
            data: {
              ...payload,
              author_id: session.id,
            },
          })
          if (tagsList.length > 0) {
            await prisma.news_tags.createMany({
              data: tagsList.map((tag_name) => ({ news_id: item.id, tag_name: tag_name.slice(0, 50) })),
              skipDuplicates: true,
            })
          }
          await logAudit('CREATE', 'news', item.id, `Created news: ${item.title}`)
        }

        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item })
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.news_tags.deleteMany({ where: { news_id: id } })
        await prisma.news.delete({ where: { id } })
        await logAudit('DELETE', 'news', id, `Deleted news #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_category') {
        const name = String(data.name || '').trim()
        const slug =
          String(data.slug || name)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\wก-๙-]/g, '') || `cat-${Date.now()}`

        if (data.id) {
          const cat = await prisma.news_categories.update({
            where: { id: Number(data.id) },
            data: { name, slug },
          })
          await logAudit('UPDATE', 'news_categories', cat.id, `Updated news category: ${name}`)
          return NextResponse.json({ success: true, category: cat })
        } else {
          const cat = await prisma.news_categories.create({
            data: { name, slug },
          })
          await logAudit('CREATE', 'news_categories', cat.id, `Created news category: ${name}`)
          return NextResponse.json({ success: true, category: cat })
        }
      }

      if (action === 'delete_category') {
        const id = Number(data.id)
        await prisma.news_categories.delete({ where: { id } })
        await logAudit('DELETE', 'news_categories', id, `Deleted news category #${id}`)
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 3. STATIC PAGES
    // =========================================================================
    if (moduleName === 'pages') {
      if (action === 'save') {
        const title = String(data.title || '').trim()
        const slug =
          String(data.slug || title)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\wก-๙-]/g, '') || `page-${Date.now()}`

        const payload = {
          title,
          slug,
          subtitle: data.subtitle || null,
          layout: data.layout || 'default',
          featured_image: data.featured_image || null,
          content: data.content || '',
          blocks_data: data.blocks_data
            ? typeof data.blocks_data === 'string'
              ? data.blocks_data
              : JSON.stringify(data.blocks_data)
            : null,
          meta_title: data.meta_title || null,
          meta_description: data.meta_description || null,
        }

        if (data.id) {
          const item = await prisma.static_pages.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'static_pages', item.id, `Updated page: ${item.title}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.static_pages.create({ data: payload })
          await logAudit('CREATE', 'static_pages', item.id, `Created page: ${item.title}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.static_pages.delete({ where: { id } })
        await logAudit('DELETE', 'static_pages', id, `Deleted static page #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 4. PERSONNEL
    // =========================================================================
    if (moduleName === 'personnel') {
      if (action === 'save') {
        const detailsCombined =
          data.details !== undefined
            ? String(data.details || '')
            : `${data.details_tab1 || ''}\n---\n${data.details_tab2 || ''}`

        let personCatId = data.category_id ? Number(data.category_id) : 0
        if (!personCatId) {
          const firstPCat = await prisma.personnel_categories.findFirst({ orderBy: { id: 'asc' } })
          if (firstPCat) {
            personCatId = firstPCat.id
          } else {
            const createdPCat = await prisma.personnel_categories.create({
              data: { name: 'บุคลากรทั่วไป', order_num: 1 },
            })
            personCatId = createdPCat.id
          }
        }

        const payload = {
          name: String(data.name || '').trim(),
          academic_standing: data.academic_standing || null,
          position: String(data.position || '').trim(),
          special_duty: data.special_duty || null,
          category_id: personCatId,
          curriculum_id: data.curriculum_id ? Number(data.curriculum_id) : null,
          details: detailsCombined,
          contact_info: data.contact_info || null,
          image_path: data.image_path || null,
          order_num: Number(data.order_num ?? 0),
          is_active: Boolean(data.is_active ?? true),
          is_head: Boolean(data.is_head ?? false),
          is_executive: Boolean(data.is_executive ?? false),
        }

        let person: any
        if (data.id) {
          person = await prisma.personnel.update({
            where: { id: Number(data.id) },
            data: payload,
          })
        } else {
          person = await prisma.personnel.create({
            data: payload,
          })
        }

        // Sync personnel_position_links
        if (Array.isArray(data.position_ids)) {
          await prisma.personnel_position_links.deleteMany({
            where: { personnel_id: person.id },
          })
          const validPosIds = data.position_ids.map((n: any) => Number(n)).filter(Boolean)
          if (validPosIds.length > 0) {
            await prisma.personnel_position_links.createMany({
              data: validPosIds.map((position_id: number) => ({
                personnel_id: person.id,
                position_id,
              })),
              skipDuplicates: true,
            })
          }
        }

        // Sync personnel_special_duties
        if (Array.isArray(data.special_duties)) {
          await prisma.personnel_special_duties.deleteMany({
            where: { personnel_id: person.id },
          })
          const validDuties = data.special_duties.filter((d: any) => d && Number(d.category_id))
          if (validDuties.length > 0) {
            await prisma.personnel_special_duties.createMany({
              data: validDuties.map((d: any) => ({
                personnel_id: person.id,
                category_id: Number(d.category_id),
                special_position: d.special_position || null,
                is_head: Boolean(d.is_head ?? false),
              })),
            })
          }
        }

        await logAudit(
          data.id ? 'UPDATE' : 'CREATE',
          'personnel',
          person.id,
          `${data.id ? 'Updated' : 'Created'} personnel: ${person.name}`
        )
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item: person })
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.personnel_position_links.deleteMany({ where: { personnel_id: id } })
        await prisma.personnel_special_duties.deleteMany({ where: { personnel_id: id } })
        await prisma.personnel.delete({ where: { id } })
        await logAudit('DELETE', 'personnel', id, `Deleted personnel #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'import_csv') {
        const rows = Array.isArray(data.rows) ? data.rows : []
        const firstPCat = await prisma.personnel_categories.findFirst({ orderBy: { id: 'asc' } })
        const fallbackCatId = firstPCat ? firstPCat.id : 1
        let createdCount = 0
        for (const r of rows) {
          if (!r.name) continue
          await prisma.personnel.create({
            data: {
              name: String(r.name).trim(),
              position: String(r.position || 'ครู').trim(),
              academic_standing: r.academic_standing ? String(r.academic_standing).trim() : null,
              category_id: r.category_id ? Number(r.category_id) : fallbackCatId,
              contact_info: r.contact_info ? String(r.contact_info).trim() : null,
              order_num: Number(r.order_num ?? 0),
              is_active: true,
            },
          })
          createdCount++
        }
        await logAudit('IMPORT', 'personnel', undefined, `Imported ${createdCount} personnel from CSV`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, count: createdCount })
      }
    }

    // =========================================================================
    // 5. EXECUTIVES
    // =========================================================================
    if (moduleName === 'executives') {
      if (action === 'save_order') {
        const orders: Array<{ id: number; order_num: number }> = Array.isArray(data.orders)
          ? data.orders
          : []
        for (const o of orders) {
          await prisma.personnel.update({
            where: { id: Number(o.id) },
            data: { order_num: Number(o.order_num) },
          })
        }
        await logAudit('UPDATE', 'executives', undefined, 'Updated executives display order')
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'appoint') {
        const id = Number(data.personnel_id)
        const orderNum = Number(data.order_num ?? 1)
        await prisma.personnel.update({
          where: { id },
          data: { is_executive: true, order_num: orderNum },
        })
        await logAudit('UPDATE', 'executives', id, `Appointed personnel #${id} to executives`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'remove') {
        const id = Number(data.personnel_id)
        await prisma.personnel.update({
          where: { id },
          data: { is_executive: false },
        })
        await logAudit('UPDATE', 'executives', id, `Removed personnel #${id} from executives`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 6. PERSONNEL CATEGORIES & SUB-DEPARTMENTS
    // =========================================================================
    if (moduleName === 'personnel_categories') {
      if (action === 'save' || action === 'create' || action === 'create_sub' || action === 'update') {
        const payload = {
          name: String(data.name || '').trim(),
          parent_id: data.parent_id ? Number(data.parent_id) : null,
          order_num: Number(data.order_num ?? 0),
        }
        if (data.id) {
          const item = await prisma.personnel_categories.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'personnel_categories', item.id, `Updated category: ${item.name}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.personnel_categories.create({ data: payload })
          await logAudit('CREATE', 'personnel_categories', item.id, `Created category: ${item.name}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'update_order') {
        const orders = data.orders || {}
        for (const [idStr, orderVal] of Object.entries(orders)) {
          const id = Number(idStr)
          if (!isNaN(id) && id > 0) {
            await prisma.personnel_categories.update({
              where: { id },
              data: { order_num: Number(orderVal) },
            })
          }
        }
        await logAudit('UPDATE', 'personnel_categories', 0, 'Updated personnel categories order')
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.personnel_categories.updateMany({
          where: { parent_id: id },
          data: { parent_id: null },
        })
        await prisma.personnel_categories.delete({ where: { id } })
        await logAudit('DELETE', 'personnel_categories', id, `Deleted personnel category #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'reorder') {
        const id = Number(data.id)
        const direction = data.direction as 'up' | 'down'
        const current = await prisma.personnel_categories.findUnique({ where: { id } })
        if (current) {
          const siblings = await prisma.personnel_categories.findMany({
            where: { parent_id: current.parent_id },
            orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
          })
          const idx = siblings.findIndex((s) => s.id === id)
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx >= 0 && swapIdx < siblings.length) {
            const other = siblings[swapIdx]
            await prisma.personnel_categories.update({
              where: { id: current.id },
              data: { order_num: other.order_num },
            })
            await prisma.personnel_categories.update({
              where: { id: other.id },
              data: { order_num: current.order_num },
            })
          }
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'add_to_navbar' || action === 'add_to_nav') {
        const catId = Number(data.cat_id || data.category_id)
        const parentNavId = data.parent_nav_id ? Number(data.parent_nav_id) : (data.parent_id ? Number(data.parent_id) : null)
        const pageType = data.page_type || (data.is_sub ? 'sub_dept' : 'dept')

        const cat = await prisma.personnel_categories.findUnique({ where: { id: catId } })
        if (!cat) {
          return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        const legacyUrl = (pageType === 'sub_dept' ? 'personnel_sub_dept.php?id=' : 'personnel_dept.php?id=') + catId
        const modernUrl = (pageType === 'sub_dept' ? '/personnel/sub-dept/' : '/personnel/dept/') + catId

        const existing = await prisma.navbars.findFirst({
          where: {
            OR: [
              { url: legacyUrl },
              { url: modernUrl },
              { url: `/personnel?category=${catId}` },
            ],
          },
        })

        if (existing) {
          const updated = await prisma.navbars.update({
            where: { id: existing.id },
            data: { parent_id: parentNavId, label: data.label || cat.name },
          })
          await logAudit('UPDATE', 'navbars', updated.id, `Updated navbar parent for category ID: ${catId}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item: updated })
        } else {
          const maxOrder = await prisma.navbars.aggregate({
            where: { parent_id: parentNavId },
            _max: { order_num: true },
          })
          const nextOrder = (maxOrder._max.order_num ?? 0) + 1

          const nav = await prisma.navbars.create({
            data: {
              label: String(data.label || cat.name).trim(),
              url: legacyUrl,
              parent_id: parentNavId,
              order_num: nextOrder,
              is_active: true,
            },
          })
          await logAudit('CREATE', 'navbars', nav.id, `Added personnel category to navbar: ${nav.label}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item: nav })
        }
      }

      if (action === 'manage_sub_department_save') {
        const subId = Number(data.sub_id)
        const assignedIds = new Set((data.assigned_personnel || []).map((x: any) => Number(x)))
        const headIds = new Set((data.head_personnel || []).map((x: any) => Number(x)))

        const subDept = await prisma.personnel_categories.findUnique({ where: { id: subId } })
        if (!subDept) {
          return NextResponse.json({ error: 'Sub-department not found' }, { status: 404 })
        }

        let fallbackCatId = subDept.parent_id
        if (!fallbackCatId) {
          const fallbackDept = await prisma.personnel_categories.findFirst({
            where: { parent_id: null, id: { not: subId } },
            orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
          })
          fallbackCatId = fallbackDept ? fallbackDept.id : 1
        }

        const allPersonnel = await prisma.personnel.findMany({ select: { id: true, category_id: true } })

        for (const p of allPersonnel) {
          const isAssigned = assignedIds.has(p.id)
          const isHead = headIds.has(p.id)

          if (p.category_id === subId) {
            if (isAssigned) {
              await prisma.personnel.update({
                where: { id: p.id },
                data: { is_head: isHead },
              })
            } else {
              await prisma.personnel.update({
                where: { id: p.id },
                data: { category_id: fallbackCatId, is_head: false },
              })
            }
          } else {
            const special = await prisma.personnel_special_duties.findFirst({
              where: { personnel_id: p.id, category_id: subId },
            })

            if (isAssigned) {
              if (special) {
                await prisma.personnel_special_duties.update({
                  where: { id: special.id },
                  data: { is_head: isHead },
                })
              } else {
                await prisma.personnel_special_duties.create({
                  data: {
                    personnel_id: p.id,
                    category_id: subId,
                    is_head: isHead,
                  },
                })
              }
            } else {
              if (special) {
                await prisma.personnel_special_duties.delete({
                  where: { id: special.id },
                })
              }
            }
          }
        }

        await logAudit('UPDATE', 'personnel_categories', subId, `Managed personnel and heads for sub-department: ${subDept.name}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'sub_dept_manage') {
        const categoryId = Number(data.category_id)
        const personnelId = Number(data.personnel_id)
        const subAction = String(data.sub_action)

        if (subAction === 'add_main') {
          await prisma.personnel.update({
            where: { id: personnelId },
            data: { category_id: categoryId, is_head: Boolean(data.is_head ?? false) },
          })
        } else if (subAction === 'add_special') {
          await prisma.personnel_special_duties.create({
            data: {
              personnel_id: personnelId,
              category_id: categoryId,
              special_position: data.special_position || null,
              is_head: Boolean(data.is_head ?? false),
            },
          })
        } else if (subAction === 'remove_main') {
          await prisma.personnel.update({
            where: { id: personnelId },
            data: { is_head: false },
          })
        } else if (subAction === 'remove_special') {
          if (data.duty_id) {
            await prisma.personnel_special_duties.delete({
              where: { id: Number(data.duty_id) },
            })
          } else {
            await prisma.personnel_special_duties.deleteMany({
              where: { personnel_id: personnelId, category_id: categoryId },
            })
          }
        } else if (subAction === 'toggle_head_main') {
          await prisma.personnel.update({
            where: { id: personnelId },
            data: { is_head: Boolean(data.is_head) },
          })
        } else if (subAction === 'toggle_head_special') {
          await prisma.personnel_special_duties.update({
            where: { id: Number(data.duty_id) },
            data: { is_head: Boolean(data.is_head) },
          })
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 7. PERSONNEL POSITIONS
    // =========================================================================
    if (moduleName === 'personnel_positions') {
      if (action === 'save') {
        const payload = {
          name: String(data.name || '').trim(),
          order_num: Number(data.order_num ?? 0),
        }
        if (data.id) {
          const item = await prisma.personnel_positions.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'personnel_positions', item.id, `Updated position: ${item.name}`)
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.personnel_positions.create({ data: payload })
          await logAudit('CREATE', 'personnel_positions', item.id, `Created position: ${item.name}`)
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.personnel_position_links.deleteMany({ where: { position_id: id } })
        await prisma.personnel_positions.delete({ where: { id } })
        await logAudit('DELETE', 'personnel_positions', id, `Deleted position #${id}`)
        return NextResponse.json({ success: true })
      }

      if (action === 'reorder') {
        const id = Number(data.id)
        const direction = data.direction as 'up' | 'down'
        const all = await prisma.personnel_positions.findMany({
          orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
        })
        const idx = all.findIndex((p) => p.id === id)
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        if (swapIdx >= 0 && swapIdx < all.length) {
          const curr = all[idx]
          const other = all[swapIdx]
          await prisma.personnel_positions.update({
            where: { id: curr.id },
            data: { order_num: other.order_num },
          })
          await prisma.personnel_positions.update({
            where: { id: other.id },
            data: { order_num: curr.order_num },
          })
        }
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 8. CURRICULUM
    // =========================================================================
    if (moduleName === 'curriculum') {
      if (action === 'save') {
        const galleryStr = Array.isArray(data.gallery_images)
          ? data.gallery_images.filter(Boolean).join(',')
          : String(data.gallery_images || '')

        const payload = {
          name: String(data.name || '').trim(),
          level: String(data.level || 'ปวช.-ปวส.').trim(),
          code: data.code || null,
          description: data.description || null,
          qualification: data.qualification || null,
          duration: data.duration || null,
          image_path: data.image_path || null,
          file_path: data.file_path || null,
          website_url: data.website_url || null,
          gallery_images: galleryStr || null,
          career_guidelines: data.career_guidelines || null,
        }

        let item
        if (data.id) {
          item = await prisma.curriculums.update({
            where: { id: Number(data.id) },
            data: payload,
          })
        } else {
          item = await prisma.curriculums.create({ data: payload })
        }

        // Sync assigned teachers via personnel.curriculum_id
        if (Array.isArray(data.teacher_ids)) {
          await prisma.personnel.updateMany({
            where: { curriculum_id: item.id },
            data: { curriculum_id: null },
          })
          const validIds = data.teacher_ids.map((n: any) => Number(n)).filter(Boolean)
          if (validIds.length > 0) {
            await prisma.personnel.updateMany({
              where: { id: { in: validIds } },
              data: { curriculum_id: item.id },
            })
          }
        }

        await logAudit(
          data.id ? 'UPDATE' : 'CREATE',
          'curriculums',
          item.id,
          `${data.id ? 'Updated' : 'Created'} curriculum: ${item.name}`
        )
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item })
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.personnel.updateMany({
          where: { curriculum_id: id },
          data: { curriculum_id: null },
        })
        await prisma.curriculums.delete({ where: { id } })
        await logAudit('DELETE', 'curriculums', id, `Deleted curriculum #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_intro') {
        const entries = [
          { key: 'curriculum_intro_title', val: String(data.curriculum_intro_title || '') },
          { key: 'curriculum_intro_desc', val: String(data.curriculum_intro_desc || '') },
        ]
        for (const e of entries) {
          await prisma.settings.upsert({
            where: { setting_key: e.key },
            update: { setting_value: e.val },
            create: { setting_key: e.key, setting_value: e.val },
          })
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'add_to_navbar') {
        const nav = await prisma.navbars.create({
          data: {
            label: String(data.label || '').trim(),
            url: String(data.url || '/curriculum').trim(),
            parent_id: data.parent_id ? Number(data.parent_id) : null,
            order_num: Number(data.order_num ?? 0),
            is_active: true,
          },
        })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item: nav })
      }
    }

    // =========================================================================
    // 9. ITA MANAGEMENT
    // =========================================================================
    if (moduleName === 'ita') {
      if (action === 'add_year') {
        const year = Number(data.year || data.new_year)
        const existing = await prisma.ita_main_topics.findFirst({ where: { year } })
        if (!existing) {
          await prisma.ita_main_topics.create({
            data: {
              name: `หัวข้อหลักเริ่มต้น`,
              order_no: 1,
              year,
            },
          })
        }
        await logAudit('CREATE', 'ita', year, `Added ITA fiscal year ${year}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, year })
      }

      if (action === 'clone_year') {
        const sourceYear = Number(data.source_year || data.from_year)
        const targetYear = Number(data.target_year || data.to_year)
        const includeLinks = data.include_links !== undefined ? Boolean(data.include_links) : true

        const mainTopics = await prisma.ita_main_topics.findMany({
          where: { year: sourceYear },
          include: {
            ita_sub_topics: {
              include: {
                ita_tables: {
                  include: {
                    ita_items: {
                      include: { ita_links: true },
                    },
                  },
                },
              },
            },
          },
        })

        for (const mt of mainTopics) {
          const newMt = await prisma.ita_main_topics.create({
            data: {
              name: mt.name,
              order_no: mt.order_no,
              year: targetYear,
            },
          })
          for (const st of mt.ita_sub_topics) {
            const newSt = await prisma.ita_sub_topics.create({
              data: {
                main_topic_id: newMt.id,
                code: st.code,
                name: st.name,
                order_no: st.order_no,
              },
            })
            for (const tb of st.ita_tables) {
              const newTb = await prisma.ita_tables.create({
                data: {
                  sub_topic_id: newSt.id,
                  name: tb.name,
                  order_no: tb.order_no,
                },
              })
              for (const item of tb.ita_items) {
                const newItem = await prisma.ita_items.create({
                  data: {
                    table_id: newTb.id,
                    item_code: item.item_code,
                    info_detail: item.info_detail,
                    element_detail: item.element_detail,
                    order_no: item.order_no,
                  },
                })
                if (includeLinks && item.ita_links.length > 0) {
                  await prisma.ita_links.createMany({
                    data: item.ita_links.map((ln) => ({
                      item_id: newItem.id,
                      link_type: ln.link_type,
                      url: ln.url,
                      file_size: ln.file_size,
                      mime_type: ln.mime_type,
                      link_name: ln.link_name,
                    })),
                  })
                }
              }
            }
          }
        }
        await logAudit('CREATE', 'ita', targetYear, `Cloned ITA from ${sourceYear} to ${targetYear}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'delete_year') {
        const year = Number(data.year || data.delete_year)
        await prisma.ita_main_topics.deleteMany({ where: { year } })
        await prisma.settings.deleteMany({
          where: {
            setting_key: {
              in: [`ita_cover_banner_${year}`, `ita_badge_${year}`],
            },
          },
        })
        await logAudit('DELETE', 'ita', year, `Deleted ITA fiscal year ${year}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_banner_settings' || action === 'save_settings') {
        const year = data.year ? Number(data.year) : null
        const bannerVal = data.ita_banner_image ?? data.banner_url
        const badgeVal = data.ita_badge_image ?? data.badge_url

        if (bannerVal !== undefined) {
          const val = String(bannerVal || '')
          if (year) {
            await prisma.settings.upsert({
              where: { setting_key: `ita_cover_banner_${year}` },
              update: { setting_value: val },
              create: { setting_key: `ita_cover_banner_${year}`, setting_value: val },
            })
          }
          await prisma.settings.upsert({
            where: { setting_key: 'ita_banner_image' },
            update: { setting_value: val },
            create: { setting_key: 'ita_banner_image', setting_value: val },
          })
          if (val) {
            await prisma.ita_banners.create({
              data: {
                url: val,
                original_name: data.original_name || 'ITA Banner',
              },
            }).catch(() => null)
          }
        }

        if (badgeVal !== undefined) {
          const val = String(badgeVal || '')
          if (year) {
            await prisma.settings.upsert({
              where: { setting_key: `ita_badge_${year}` },
              update: { setting_value: val },
              create: { setting_key: `ita_badge_${year}`, setting_value: val },
            })
          }
          await prisma.settings.upsert({
            where: { setting_key: 'ita_badge_image' },
            update: { setting_value: val },
            create: { setting_key: 'ita_badge_image', setting_value: val },
          })
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_main_topic' || action === 'save_main') {
        const payload = {
          name: String(data.name || '').trim(),
          order_no: Number(data.order_no ?? 1),
          year: Number(data.year ?? 2569),
        }
        if (data.id) {
          const item = await prisma.ita_main_topics.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.ita_main_topics.create({ data: payload })
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete_main_topic' || action === 'delete_main') {
        await prisma.ita_main_topics.delete({ where: { id: Number(data.id) } })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_sub_topic' || action === 'save_sub') {
        const payload = {
          main_topic_id: Number(data.main_topic_id),
          code: data.code || null,
          name: String(data.name || '').trim(),
          order_no: Number(data.order_no ?? 1),
        }
        if (data.id) {
          const item = await prisma.ita_sub_topics.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.ita_sub_topics.create({ data: payload })
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete_sub_topic' || action === 'delete_sub') {
        await prisma.ita_sub_topics.delete({ where: { id: Number(data.id) } })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_table') {
        const payload = {
          sub_topic_id: Number(data.sub_topic_id),
          name: String(data.name || '').trim(),
          order_no: Number(data.order_no ?? 1),
        }
        if (data.id) {
          const item = await prisma.ita_tables.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.ita_tables.create({ data: payload })
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete_table') {
        await prisma.ita_tables.delete({ where: { id: Number(data.id) } })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_item') {
        const payload = {
          table_id: Number(data.table_id),
          item_code: String(data.item_code || '').trim(),
          info_detail: String(data.info_detail || '').trim(),
          element_detail: data.element_detail || null,
          order_no: Number(data.order_no ?? 1),
        }
        let item
        if (data.id) {
          item = await prisma.ita_items.update({
            where: { id: Number(data.id) },
            data: payload,
          })
        } else {
          item = await prisma.ita_items.create({ data: payload })
        }

        if (Array.isArray(data.links)) {
          await prisma.ita_links.deleteMany({ where: { item_id: item.id } })
          const validLinks = data.links.filter((l: any) => l && l.url)
          if (validLinks.length > 0) {
            await prisma.ita_links.createMany({
              data: validLinks.map((l: any) => ({
                item_id: item.id,
                link_type: (['url', 'file', 'text'].includes(l.link_type) ? l.link_type : 'url') as
                  | 'url'
                  | 'file'
                  | 'text',
                url: String(l.url),
                link_name: l.link_name || null,
                file_size: l.file_size ? Number(l.file_size) : null,
                mime_type: l.mime_type || null,
              })),
            })
          }
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item })
      }

      if (action === 'delete_item') {
        await prisma.ita_items.delete({ where: { id: Number(data.id) } })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 10. COMPLAINTS
    // =========================================================================
    if (moduleName === 'complaints') {
      if (action === 'update_status') {
        const id = Number(data.id)
        const item = await prisma.complaints.update({
          where: { id },
          data: {
            status: data.status as 'pending' | 'investigating' | 'resolved' | 'dismissed',
            status_note: data.status_note ?? null,
            is_published: Boolean(data.is_published ?? false),
          },
        })
        await logAudit('UPDATE', 'complaints', id, `Updated complaint #${item.ticket_number} to ${item.status}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item })
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.complaints.delete({ where: { id } })
        await logAudit('DELETE', 'complaints', id, `Deleted complaint #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 11. MEDIA LIBRARY
    // =========================================================================
    if (moduleName === 'media') {
      if (action === 'rename') {
        const id = Number(data.id)
        const item = await prisma.media.update({
          where: { id },
          data: { file_name: String(data.file_name || '').trim() },
        })
        await logAudit('UPDATE', 'media', id, `Renamed media #${id} to ${item.file_name}`)
        return NextResponse.json({ success: true, item })
      }

      if (action === 'delete') {
        const id = Number(data.id)
        const mediaItem = await prisma.media.findUnique({ where: { id } })
        if (mediaItem) {
          const diskPath = path.join(process.cwd(), 'public', mediaItem.file_path.replace(/^\/+/, ''))
          await fs.unlink(diskPath).catch(() => null)
          await prisma.media.delete({ where: { id } })
        }
        await logAudit('DELETE', 'media', id, `Deleted media #${id}`)
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 12. GALLERIES
    // =========================================================================
    if (moduleName === 'galleries') {
      if (action === 'save_album') {
        const payload = {
          title: String(data.title || '').trim(),
          description: data.description || null,
          cover_image: data.cover_image || null,
        }
        if (data.id) {
          const item = await prisma.galleries.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'galleries', item.id, `Updated gallery album: ${item.title}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.galleries.create({ data: payload })
          if (Array.isArray(data.image_paths) && data.image_paths.length > 0) {
            await prisma.gallery_images.createMany({
              data: data.image_paths.map((p: string) => ({
                gallery_id: item.id,
                image_path: p,
              })),
            })
            if (!item.cover_image) {
              await prisma.galleries.update({
                where: { id: item.id },
                data: { cover_image: data.image_paths[0] },
              })
            }
          }
          await logAudit('CREATE', 'galleries', item.id, `Created gallery album: ${item.title}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete_album') {
        const id = Number(data.id)
        await prisma.gallery_images.deleteMany({ where: { gallery_id: id } })
        await prisma.galleries.delete({ where: { id } })
        await logAudit('DELETE', 'galleries', id, `Deleted gallery album #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'add_images') {
        const galleryId = Number(data.gallery_id)
        const paths: string[] = Array.isArray(data.image_paths) ? data.image_paths : []
        if (paths.length > 0) {
          await prisma.gallery_images.createMany({
            data: paths.map((image_path) => ({ gallery_id: galleryId, image_path })),
          })
          const album = await prisma.galleries.findUnique({ where: { id: galleryId } })
          if (album && !album.cover_image) {
            await prisma.galleries.update({
              where: { id: galleryId },
              data: { cover_image: paths[0] },
            })
          }
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'delete_image') {
        const id = Number(data.id)
        await prisma.gallery_images.delete({ where: { id } })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'bulk_delete_images') {
        const ids: number[] = Array.isArray(data.ids) ? data.ids.map(Number) : []
        if (ids.length > 0) {
          await prisma.gallery_images.deleteMany({ where: { id: { in: ids } } })
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'set_cover') {
        const galleryId = Number(data.gallery_id)
        await prisma.galleries.update({
          where: { id: galleryId },
          data: { cover_image: String(data.cover_image || '') },
        })
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'import_immich_album') {
        const settings = await getSettings()
        const serverUrl = (settings.immich_server_url || '').replace(/\/+$/, '')
        const apiKey = settings.immich_api_key || ''
        if (!serverUrl || !apiKey) {
          return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า Immich Server' }, { status: 400 })
        }

        const res = await fetch(`${serverUrl}/api/albums/${data.immich_album_id}`, {
          headers: { 'x-api-key': apiKey, Accept: 'application/json' },
          cache: 'no-store',
        })
        if (!res.ok) {
          return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลอัลบั้มจาก Immich ได้' }, { status: 400 })
        }
        const albumData = await res.json()
        const assets = Array.isArray(albumData.assets) ? albumData.assets : []
        const imageUrls = assets
          .filter((a: any) => a.type === 'IMAGE' || !a.type)
          .map((a: any) => `${serverUrl}/api/assets/${a.id}/thumbnail?size=preview`)

        const created = await prisma.galleries.create({
          data: {
            title: String(data.title || albumData.albumName || 'Immich Album').trim(),
            description: data.description || albumData.description || null,
            cover_image: imageUrls[0] || null,
          },
        })

        if (imageUrls.length > 0) {
          await prisma.gallery_images.createMany({
            data: imageUrls.map((image_path: string) => ({
              gallery_id: created.id,
              image_path,
            })),
          })
        }

        await logAudit('CREATE', 'galleries', created.id, `Imported Immich album: ${created.title}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, item: created, count: imageUrls.length })
      }

      if (action === 'import_shared_link') {
        const sharedUrl = String(data.shared_url || '').trim()
        if (!sharedUrl) {
          return NextResponse.json({ error: 'กรุณาระบุ URL ลิงก์แชร์' }, { status: 400 })
        }

        const extractedUrls: string[] = []
        // Check if multiple URLs or direct image URLs were pasted
        const lines = sharedUrl
          .split(/[\r\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)

        for (const line of lines) {
          if (/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(line)) {
            extractedUrls.push(line)
          } else if (line.includes('drive.google.com/file/d/')) {
            const match = line.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
            if (match?.[1]) {
              extractedUrls.push(`https://lh3.googleusercontent.com/d/${match[1]}=w1600`)
            }
          } else {
            try {
              const resp = await fetch(line, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                },
              })
              const html = await resp.text()
              // Google Photos / Drive / OpenGraph image extraction
              const lh3Matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_-]+/g)
              if (lh3Matches && lh3Matches.length > 0) {
                const unique = Array.from(new Set(lh3Matches)).slice(0, 60)
                unique.forEach((u) => extractedUrls.push(`${u}=w1600`))
              }
              const ogMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
              if (ogMatch?.[1] && extractedUrls.length === 0) {
                extractedUrls.push(ogMatch[1])
              }
            } catch {
              // fallback to using the URL directly
              extractedUrls.push(line)
            }
          }
        }

        const finalUrls = Array.from(new Set(extractedUrls))
        if (finalUrls.length === 0) {
          return NextResponse.json(
            { error: 'ไม่พบรูปภาพจากลิงก์ที่ระบุ กรุณาตรวจสอบว่าเป็นลิงก์สาธารณะ' },
            { status: 400 }
          )
        }

        let targetGalleryId = data.gallery_id ? Number(data.gallery_id) : 0
        if (!targetGalleryId) {
          const created = await prisma.galleries.create({
            data: {
              title: String(data.title || 'อัลบั้มนำเข้าจากลิงก์แชร์').trim(),
              description: data.description || `Imported from ${sharedUrl.slice(0, 100)}`,
              cover_image: finalUrls[0],
            },
          })
          targetGalleryId = created.id
        }

        await prisma.gallery_images.createMany({
          data: finalUrls.map((image_path) => ({
            gallery_id: targetGalleryId,
            image_path,
          })),
        })

        revalidatePath('/', 'layout')
        return NextResponse.json({
          success: true,
          gallery_id: targetGalleryId,
          count: finalUrls.length,
        })
      }
    }

    // =========================================================================
    // 13. DOWNLOADS & DOWNLOAD CATEGORIES
    // =========================================================================
    if (moduleName === 'downloads') {
      if (action === 'save') {
        let dlCatId = data.category_id ? Number(data.category_id) : 0
        if (!dlCatId) {
          const firstDlCat = await prisma.download_categories.findFirst({ orderBy: { id: 'asc' } })
          if (firstDlCat) {
            dlCatId = firstDlCat.id
          } else {
            const createdDlCat = await prisma.download_categories.create({
              data: { name: 'เอกสารทั่วไป', order_num: 1 },
            })
            dlCatId = createdDlCat.id
          }
        }
        const payload = {
          title: String(data.title || '').trim(),
          category_id: dlCatId,
          file_path: String(data.file_path || '').trim(),
          file_type: data.file_type || 'pdf',
          file_size: Number(data.file_size ?? 0),
        }
        if (data.id) {
          const item = await prisma.downloads.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'downloads', item.id, `Updated download: ${item.title}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.downloads.create({ data: payload })
          await logAudit('CREATE', 'downloads', item.id, `Created download: ${item.title}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.downloads.delete({ where: { id } })
        await logAudit('DELETE', 'downloads', id, `Deleted download #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'save_category') {
        const payload = {
          name: String(data.name || '').trim(),
          order_num: Number(data.order_num ?? 0),
        }
        if (data.id) {
          const item = await prisma.download_categories.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.download_categories.create({ data: payload })
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete_category') {
        const id = Number(data.id)
        await prisma.download_categories.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 14. USERS
    // =========================================================================
    if (moduleName === 'users') {
      if (action === 'save') {
        const username = String(data.username || '').trim()
        const email = String(data.email || '').trim()
        const role = (['admin', 'editor', 'staff'].includes(data.role) ? data.role : 'staff') as
          | 'admin'
          | 'editor'
          | 'staff'
        const allowedPages = Array.isArray(data.allowed_pages)
          ? JSON.stringify(data.allowed_pages)
          : data.allowed_pages || null

        if (data.id) {
          const updateData: any = {
            username,
            email,
            role,
            allowed_pages: allowedPages,
          }
          if (data.password && String(data.password).trim().length > 0) {
            updateData.password = await bcrypt.hash(String(data.password).trim(), 10)
          }
          const user = await prisma.users.update({
            where: { id: Number(data.id) },
            data: updateData,
          })
          await logAudit('UPDATE', 'users', user.id, `Updated user: ${user.username}`)
          return NextResponse.json({ success: true, user: { id: user.id, username: user.username } })
        } else {
          if (!data.password) {
            return NextResponse.json({ error: 'กรุณากำหนดรหัสผ่าน' }, { status: 400 })
          }
          const hashedPassword = await bcrypt.hash(String(data.password).trim(), 10)
          const user = await prisma.users.create({
            data: {
              username,
              email,
              password: hashedPassword,
              role,
              allowed_pages: allowedPages,
            },
          })
          await logAudit('CREATE', 'users', user.id, `Created user: ${user.username}`)
          return NextResponse.json({ success: true, user: { id: user.id, username: user.username } })
        }
      }

      if (action === 'delete') {
        const id = Number(data.id)
        if (id === session.id) {
          return NextResponse.json({ error: 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' }, { status: 400 })
        }
        await prisma.users.delete({ where: { id } })
        await logAudit('DELETE', 'users', id, `Deleted user #${id}`)
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 15. NAVBARS
    // =========================================================================
    if (moduleName === 'navbars') {
      if (action === 'save') {
        const payload = {
          label: String(data.label || '').trim(),
          url: String(data.url || '#').trim(),
          icon: data.icon || null,
          parent_id: data.parent_id ? Number(data.parent_id) : null,
          order_num: Number(data.order_num ?? 0),
          is_active: Boolean(data.is_active ?? true),
          target_blank: Boolean(data.target_blank ?? false),
        }
        if (data.id) {
          const item = await prisma.navbars.update({
            where: { id: Number(data.id) },
            data: payload,
          })
          await logAudit('UPDATE', 'navbars', item.id, `Updated menu item: ${item.label}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        } else {
          const item = await prisma.navbars.create({ data: payload })
          await logAudit('CREATE', 'navbars', item.id, `Created menu item: ${item.label}`)
          revalidatePath('/', 'layout')
          return NextResponse.json({ success: true, item })
        }
      }

      if (action === 'delete') {
        const id = Number(data.id)
        await prisma.navbars.delete({ where: { id } })
        await logAudit('DELETE', 'navbars', id, `Deleted menu item #${id}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'update_order') {
        const menuIds = Array.isArray(data.menu_ids) ? data.menu_ids : []
        for (let idx = 0; idx < menuIds.length; idx++) {
          await prisma.navbars.update({
            where: { id: Number(menuIds[idx]) },
            data: { order_num: idx + 1 },
          })
        }
        await logAudit('UPDATE', 'navbars', 0, 'Updated navbars order')
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }

      if (action === 'reorder') {
        const id = Number(data.id)
        const direction = data.direction as 'up' | 'down'
        const current = await prisma.navbars.findUnique({ where: { id } })
        if (current) {
          const siblings = await prisma.navbars.findMany({
            where: { parent_id: current.parent_id },
            orderBy: [{ order_num: 'asc' }, { id: 'asc' }],
          })
          const idx = siblings.findIndex((s) => s.id === id)
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx >= 0 && swapIdx < siblings.length) {
            const other = siblings[swapIdx]
            await prisma.navbars.update({
              where: { id: current.id },
              data: { order_num: other.order_num },
            })
            await prisma.navbars.update({
              where: { id: other.id },
              data: { order_num: current.order_num },
            })
          }
        }
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 16. BACKUPS
    // =========================================================================
    if (moduleName === 'backups') {
      const backupDir = path.join(process.cwd(), 'public', 'backups')
      await fs.mkdir(backupDir, { recursive: true })

      if (action === 'create') {
        const zip = new AdmZip()
        const [
          settings,
          navbars,
          sliders,
          news,
          newsCategories,
          staticPages,
          personnel,
          personnelCategories,
          personnelPositions,
          curriculums,
          galleries,
          galleryImages,
          downloads,
          downloadCategories,
          complaints,
          itaMain,
          itaSub,
          itaTables,
          itaItems,
          itaLinks,
        ] = await Promise.all([
          prisma.settings.findMany(),
          prisma.navbars.findMany(),
          prisma.sliders.findMany(),
          prisma.news.findMany(),
          prisma.news_categories.findMany(),
          prisma.static_pages.findMany(),
          prisma.personnel.findMany(),
          prisma.personnel_categories.findMany(),
          prisma.personnel_positions.findMany(),
          prisma.curriculums.findMany(),
          prisma.galleries.findMany(),
          prisma.gallery_images.findMany(),
          prisma.downloads.findMany(),
          prisma.download_categories.findMany(),
          prisma.complaints.findMany(),
          prisma.ita_main_topics.findMany(),
          prisma.ita_sub_topics.findMany(),
          prisma.ita_tables.findMany(),
          prisma.ita_items.findMany(),
          prisma.ita_links.findMany(),
        ])

        const dbDump = {
          created_at: new Date().toISOString(),
          settings,
          navbars,
          sliders,
          news,
          newsCategories,
          staticPages,
          personnel,
          personnelCategories,
          personnelPositions,
          curriculums,
          galleries,
          galleryImages,
          downloads,
          downloadCategories,
          complaints,
          itaMain,
          itaSub,
          itaTables,
          itaItems,
          itaLinks,
        }

        zip.addFile('database_backup.json', Buffer.from(JSON.stringify(dbDump, null, 2), 'utf-8'))

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        if (fsSync.existsSync(uploadsDir)) {
          zip.addLocalFolder(uploadsDir, 'uploads')
        }

        const now = new Date()
        const stamp = now
          .toISOString()
          .replace(/[-:T]/g, '')
          .slice(0, 14)
        const fileName = `backup_${stamp}.zip`
        const fullPath = path.join(backupDir, fileName)
        zip.writeZip(fullPath)

        await logAudit('BACKUP', 'system', undefined, `Created full system backup: ${fileName}`)
        return NextResponse.json({
          success: true,
          file: {
            name: fileName,
            url: `/backups/${fileName}`,
          },
        })
      }

      if (action === 'delete') {
        const safeName = path.basename(String(data.filename || ''))
        if (!safeName.endsWith('.zip')) {
          return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 })
        }
        await fs.unlink(path.join(backupDir, safeName)).catch(() => null)
        await logAudit('DELETE', 'backups', undefined, `Deleted backup file: ${safeName}`)
        return NextResponse.json({ success: true })
      }

      if (action === 'restore') {
        const safeName = path.basename(String(data.filename || ''))
        const fullPath = path.join(backupDir, safeName)
        if (!fsSync.existsSync(fullPath)) {
          return NextResponse.json({ error: 'ไม่พบไฟล์สำรองข้อมูล' }, { status: 404 })
        }
        const zip = new AdmZip(fullPath)
        const dbEntry = zip.getEntry('database_backup.json')
        if (dbEntry) {
          const jsonText = dbEntry.getData().toString('utf8')
          const parsed = JSON.parse(jsonText)
          if (Array.isArray(parsed.settings)) {
            for (const s of parsed.settings) {
              await prisma.settings.upsert({
                where: { setting_key: s.setting_key },
                update: { setting_value: s.setting_value },
                create: { setting_key: s.setting_key, setting_value: s.setting_value },
              })
            }
          }
        }
        await logAudit('RESTORE', 'backups', undefined, `Restored backup: ${safeName}`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
      }
    }

    // =========================================================================
    // 17. DATABASE EXPORT / IMPORT
    // =========================================================================
    if (moduleName === 'database') {
      if (action === 'export_sql') {
        const tables: string[] = Array.isArray(data.tables) ? data.tables : []
        let sqlOutput = `-- Web CRIC MariaDB/MySQL SQL Dump\n-- Generated at ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`

        for (const table of tables) {
          const safeTable = table.replace(/[^a-zA-Z0-9_]/g, '')
          if (!safeTable) continue
          try {
            const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${safeTable}\``)
            sqlOutput += `-- Table: ${safeTable} (${rows.length} rows)\n`
            for (const row of rows) {
              const cols = Object.keys(row)
                .map((c) => `\`${c}\``)
                .join(', ')
              const vals = Object.values(row)
                .map((v) => {
                  if (v === null || v === undefined) return 'NULL'
                  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`
                  if (typeof v === 'number' || typeof v === 'bigint') return String(v)
                  if (typeof v === 'boolean') return v ? '1' : '0'
                  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
                })
                .join(', ')
              sqlOutput += `REPLACE INTO \`${safeTable}\` (${cols}) VALUES (${vals});\n`
            }
            sqlOutput += `\n`
          } catch {
            // ignore invalid table
          }
        }
        sqlOutput += `SET FOREIGN_KEY_CHECKS=1;\n`
        await logAudit('EXPORT', 'database', undefined, `Exported ${tables.length} database tables`)
        return NextResponse.json({ success: true, sql: sqlOutput })
      }

      if (action === 'import_sql') {
        const sql = String(data.sql || '')
        const statements = sql
          .split(/;\s*[\r\n]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'))

        let executed = 0
        for (const stmt of statements) {
          await prisma.$executeRawUnsafe(stmt)
          executed++
        }
        await logAudit('IMPORT', 'database', undefined, `Executed ${executed} SQL statements`)
        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true, executed })
      }
    }

    // =========================================================================
    // 18. SYSTEM UPDATE & MAINTENANCE
    // =========================================================================
    if (moduleName === 'update') {
      if (action === 'check_update') {
        return NextResponse.json({
          success: true,
          current_version: '2.6.0-nextjs16',
          latest_version: '2.6.0-nextjs16',
          up_to_date: true,
          checked_at: new Date().toISOString(),
        })
      }

      if (action === 'clear_cache') {
        revalidatePath('/', 'layout')
        await logAudit('MAINTENANCE', 'system', undefined, 'Cleared Next.js application cache')
        return NextResponse.json({ success: true })
      }

      if (action === 'sync_schema') {
        await repairDatabaseIntegrity()
        await prisma.$queryRaw`SELECT 1`
        revalidatePath('/', 'layout')
        await logAudit('MAINTENANCE', 'database', undefined, 'Verified and repaired database schema & integrity')
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ error: `Unsupported module/action: ${moduleName}/${action}` }, { status: 400 })
  } catch (error: any) {
    console.error('CMS API error:', error)
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผลคำสั่ง' },
      { status: 500 }
    )
  }
}
