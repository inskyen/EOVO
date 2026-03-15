import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabase = createClient(
  'https://lrgnfthinpjskocehgxo.supabase.co',
  'sb_publishable_Otu-n1VjTqu4H_0j6dZK_w__CkfZDji'
)

const scenes = JSON.parse(readFileSync('./public/data/scenes.json', 'utf-8'))

for (const scene of scenes) {
  const { error } = await supabase.from('scenes').insert({
    scene_id: scene.id,
    name: scene.name,
    world: scene.world,
    description: scene.description,
    characters: scene.characters,
    tags: scene.tags,
    coords: scene.coords,
    moments: scene.moments
  })
  if (error) console.error('失败:', scene.id, error.message)
  else console.log('✓', scene.name)
}